# -----------------------
# Trace out the bifurcations for a given number of
# bounces where energy starts at -1/3. When a
# bifurcation is found, trace it out using a vector
# and varying p_phi
# -----------------------

# Import needed libraries
import magphyxp
import numpy as np
import sys
import queue

# -----------------------
# Variables deciding whether
# pphi is constant or ptheta
# is constant
VARY_PTHETA_PPHI = 0
VARY_PTHETA_ENERGY = 1
# -----------------------

def get_pphi_max(E, ptheta):
    x = (E + 1/3 - ptheta**2 / 2) / 5
    if x < 0:
        return -1
    return np.sqrt(x)

def trace_mode(curr_state, mode_id):
    states = []
    # Used in determining if the energy is increasing within some margin
    epsilon = 1e-2
    #vector = np.array((0, V_STEP, 0)) # Setup vector
    vector = np.array((curr_state[0], curr_state[1], 0)) # Setup vector
    #vector = np.array((V_STEP, V_STEP, 0)) # Setup vector
    new_bifurcation = True
    while (curr_state[2] < 0):
        next_state = curr_state + vector # Follow the vector to next state
        prev_state = next_state # Save state where we came from
        pphi_max = get_pphi_max(next_state[2], next_state[0])
        if (pphi_max < 0 or next_state[1] > pphi_max or next_state[2] > 0):
            #print('break 1.2')
            break
        # Calculate new min at new location
        min_two = magphyxp.calculate_min(next_state[0], next_state[1], num_bounces, next_state[2], 1e-7, VARY_PTHETA_ENERGY, 1e-7) 
        if min_two.f > 1e-9:
            #print('break 2: f={}'.format(min_two.f))
            break
        next_state = np.array((min_two.ptheta, min_two.pphi, min_two.energy)) # New min gives new state

        # Find new vector
        vector = next_state - curr_state

        curr_state = next_state # Change current state to the newest one found
        if (next_state[2] < (prev_state[2] - epsilon)): # Make sure energy is increasing within some tolerance
            #print('break 3')
            break
        # Write out ID, N, pr, ptheta, pphi, energy, rocking number, in phase, period
        #if new_bifurcation:
        #    new_bifurcation = False
        #    mode_id += 1
        state = {
            'mode_id' : mode_id,
            'num_bounces' : num_bounces,
            'pr' : np.sqrt(abs(2*curr_state[2] + 2/3 - curr_state[0]**2 - 10*curr_state[1]**2)),
            'ptheta' : curr_state[0],
            'pphi' : curr_state[1],
            'energy' : curr_state[2],
            #'rocking_number' : int(min_two.rocking_number / 2),
            'rocking_number' : min_two.rocking_number,
            'in_phase' : min_two.rocking_in_phase,
            'period' : min_two.t
        }
        states.append(state)
        # Slowly increase the step size of the vector
        vector[1] *= 1.1
        vector[2] *= 1.1
        # -------------------------------------------
        epsilon *= 0.9 # Slowly decrease tolerance of energy difference
    return states

def search_forward(rocking_number, m_found):
    if rocking_number >= len(m_found) - 1:
        return False
    return not m_found[rocking_number+1]

def search_backward(rocking_number, m_found):
    return rocking_number > 0 and not m_found[rocking_number-1]


class BifLoc:
    def __init__(self, E, m):
        self.E = E
        self.m = m

# Does a binary search to find where E belongs in the bifurcation locations.
# If the region is surrounded by two found bifurcations such that the
# rocking numbers are next to each other, then the region is empty.
# m_max is the maximum rocking number we're going to allow.
def is_empty(E, bif_locs, m_max):
    if E == 0:
        return True
    i = 0
    j = len(bif_locs)
    while j-i > 1:
        k = (i+j)//2
        if bif_locs[k].E <= E:
            i = k
        else:
            j = k
    if bif_locs[i].m == bif_locs[j].m-1 or bif_locs[i].m == m_max:
        return True
    return False

#bif_locs = [BifLoc(-1/3, 0), BifLoc(-.22, 3),
#            BifLoc(-.1, 4), BifLoc(0, math.inf)]
#bif_locs[-1].E
#print(is_empty(-.2, bif_locs, 4))

# found_m is a list of booleans with the rocking numbers that we have found.
# bif_locs is an array storing where bifurcations (described using their
# rocking number) are located. For example, if we've found bifurcations
# m=3 and m=4:
#
#      0      3                 4     inf
#      |------|-----------------|------|
#     -.3    -.23             -.14     0
#
# The data structure is a list of tuples (E,m):
# (-.3, 0)  (-.23, 3)  (-.14, 4)  (0, inf)
def find_mode(num_bounces, min_E_0, max_E_0, m_found, bif_locs, m_max):
#    global previous_E
    global bifurcation_id

    queue = queue.Queue()
    queue.put((min_E_0, max_E_0))

    while not queue.Empty():
        (min_E, max_E) = queue.get()

        # Do a binary search in bif_locs to see if our region has
        # any bifurcations to find.
        if is_empty(min_E, bif_locs, m_max):
            return

        mode_found = False

        E = (min_E + max_E) / 2
        print('searching ({:.5f}, {:.5f})'.format(min_E, max_E));

    # Calculate minimum
    bifurcation_state = magphyxp.calculate_min(
        PTHETA_0, PPHI_0, num_bounces, E, 1e-7,
        VARY_PTHETA_ENERGY, 1e-7)

    bifurcation_E = 1
    pphi_max = get_pphi_max(bifurcation_state.energy, bifurcation_state.ptheta)
    if (bifurcation_state.f < 1e-9 and bifurcation_state.energy > -1/3
#        and bifurcation_state.energy - previous_E > E_step
        and V_STEP < pphi_max
        # duplicate state
        # and (bifurcation_state.rocking_number % num_bounces) > 0
        and bifurcation_state.t > 0.0):

        # Get the current state of pphi, ptheta, and energy
        curr_state = np.array((bifurcation_state.ptheta,
                               bifurcation_state.pphi,
                               bifurcation_state.energy))
        bifurcation_E = bifurcation_state.energy

        states = trace_mode(curr_state, bifurcation_id)

        # We sometimes get phantom modes that have a low f value.
        # This especially occurs at low energy since the free magnet is moving
        # very little. To ensure that these don't get reported as true modes
        # we go ahead and trace the mode as far as it goes and then test if it
        # reached a value of pphi above a threshold. Keep the mode only if it
        # reaches the threshold.
        if states[-1]['pphi'] > 1e-3:
            mode_found = True
            # Get the rocking number from the last state as it is more
            # reliable (less risk of numerical error).
            rocking_number = states[-1]['rocking_number']
            # Get the energy at which the bifurcation occurs.
            bif_E = states[0]['energy']

            print('found {}'.format(rocking_number))
            # If the rocking number m has already been found, look in the
            # opposite direction
            #    case 1:
            #    min_E      m          E                    max_E
            #      |--------|----------|----------------------|
            #                          |----------------------|
            #                                 look here
            #    case 2:
            #    min_E                 E     m              max_E
            #      |-------------------|-----|----------------|
            #      |-------------------|
            #          look here
            if rocking_number >= len(m_found):
                print('Out of bounds. Searching backward')
                # search backward
                find_mode(num_bounces, min_E, E, m_found)
            elif m_found[rocking_number]:
                print('already found')
                if bif_E < E:
                    # case 1
                    if search_forward(rocking_number, m_found):
                        find_mode(num_bounces, E, max_E, m_found)
                else:
                    # case 2
                    if search_backward(rocking_number, m_found):
                        find_mode(num_bounces, min_E, E, m_found)
            else:
                # Rocking number has not been found. Add it.
                m_found[rocking_number] = True
                print('setting m_found {}'.format(m_found[rocking_number]))

                for state in states:
                    f.write(
                        '{} {} {:<.5e} {:<.5e} {:<.5e} {:<.5e} {} {} {:<.5f}\n'.format(
                            state['mode_id'], state['num_bounces'], state['pr'],
                            state['ptheta'], state['pphi'],
                            state['energy'], state['rocking_number'], state['in_phase'], state['period'])
                    )

                f.flush()
                bifurcation_id += 1

                if search_forward(rocking_number, m_found):
                    find_mode(num_bounces, E, max_E, m_found)
                if search_backward(rocking_number, m_found):
                    find_mode(num_bounces, min_E, E, m_found)

    if not mode_found:
        find_mode(num_bounces, E, max_E, m_found)
        find_mode(num_bounces, min_E, E, m_found)
            

#def find_mode(num_bounces, E):
#    global previous_E
#    global bifurcation_id
#
#    # Calculate minimum
#    bifurcation_state = magphyxp.calculate_min(PTHETA_0, PPHI_0, num_bounces, E, 1e-7,
#                                               VARY_PTHETA_ENERGY, 1e-7)
#
#    bifurcation_E = 1
#    pphi_max = get_pphi_max(bifurcation_state.energy, bifurcation_state.ptheta)
#    if (bifurcation_state.f < 1e-9 and bifurcation_state.energy > -1/3
#        and bifurcation_state.energy - previous_E > E_step
#        and V_STEP < pphi_max
#        and (bifurcation_state.rocking_number % num_bounces) > 0 # duplicate state
#        and bifurcation_state.t > 0.0):
#        # Get the current state of pphi, ptheta, and energy
#        curr_state = np.array((bifurcation_state.ptheta, bifurcation_state.pphi, bifurcation_state.energy))
#        bifurcation_E = bifurcation_state.energy
#
#        states = trace_mode(curr_state, bifurcation_id)
#
#        # We sometimes get phantom modes that have a low f value. This especially
#        # occurs at low energy since the free magnet is moving very little. To ensure
#        # that these don't get reported as true modes we go ahead and trace the mode
#        # as far as it goes and then test if it reached a value of pphi above a threshold.
#        # Keep the mode only if it reaches the threshold.
#        if states[-1]['pphi'] > 1e-3:
#            for state in states:
#                f.write(
#                    #'{} {} {:<.5f} {:<.5f} {:<.5f} {:<.5f} {} {} {:<.5f}\n'.format(
#                    '{} {} {:<.5e} {:<.5e} {:<.5e} {:<.5e} {} {} {:<.5f}\n'.format(
#                        state['mode_id'], state['num_bounces'], state['pr'],
#                        state['ptheta'], state['pphi'],
#                        state['energy'], state['rocking_number'], state['in_phase'], state['period'])
#                )
#
#            f.flush()
#            bifurcation_id += 1
#            previous_E = bifurcation_state.energy

fn = '/home/bojohnson/Desktop/traces.txt'
if len(sys.argv) > 1:
    fn = sys.argv[1]
f = open(fn,'w') # File to write data to
bifurcation_id = 0
for num_bounces in range(2,3):#65):
    print('{} '.format(num_bounces), end='', flush=True)

    # For each bounce number start the search
    # with the given energy value E, the given V_STEP
    # which is the vector step size in tracing out
    # the bifurcation, and E_step which determines the
    # step for E
    #E = -1/3
    E = -1/3 + 1e-3
    #E = -0.02
    previous_E = -1 # Placeholder for now
    V_STEP = 1e-3
    E_step = 1e-7
    PTHETA_0 = 0
    PPHI_0 = 1e-9
    # ------------------------------------------------
    m_found = [False for i in range(4)]
    find_mode(num_bounces, -1/3+1e-3, -1e-3, m_found);
#    while (E <= 0):
#        find_mode(num_bounces, E);
#        E_step = E_step * 1.01
#        E = E + E_step

f.close()
